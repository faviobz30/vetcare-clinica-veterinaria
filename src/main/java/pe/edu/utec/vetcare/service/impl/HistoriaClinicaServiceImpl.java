package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.access.AccessDeniedException;
import pe.edu.utec.vetcare.security.AccesoClinico;
import pe.edu.utec.vetcare.repository.CitaRepository;
import pe.edu.utec.vetcare.dto.response.HistoriaClinicaResponse;
import pe.edu.utec.vetcare.entity.HistoriaClinicaEntity;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.HistoriaClinicaMapper;
import pe.edu.utec.vetcare.repository.HistoriaClinicaRepository;
import pe.edu.utec.vetcare.service.HistoriaClinicaService;

@Service
@RequiredArgsConstructor
public class HistoriaClinicaServiceImpl
        implements HistoriaClinicaService {

    private final HistoriaClinicaRepository repository;

    private final HistoriaClinicaMapper mapper;
    private final CitaRepository citaRepository;

    @Override
    @Transactional(readOnly = true)
    public HistoriaClinicaResponse obtener(Long id) {

        HistoriaClinicaEntity entity =
                repository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Historia clínica no encontrada"
                                )
                        );

        comprobarLectura(entity);
        return mapper.toResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public HistoriaClinicaResponse
    obtenerPorMascota(Long idMascota) {

        HistoriaClinicaEntity entity =
                repository
                        .findByMascotaIdMascota(
                                idMascota
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Historia clínica no encontrada"
                                )
                        );

        comprobarLectura(entity);
        return mapper.toResponse(entity);
    }
    private void comprobarLectura(HistoriaClinicaEntity historia) {
        var mascota = historia.getMascota();
        if (AccesoClinico.es("ADMIN") || (AccesoClinico.es("PROPIETARIO") && AccesoClinico.esPropietario(mascota))
                || (AccesoClinico.es("VETERINARIO") && citaRepository.existsByMascota_IdMascotaAndVeterinario_Usuario_Correo(
                        mascota.getIdMascota(), AccesoClinico.correo()))) return;
        throw new AccessDeniedException("No puede consultar esta historia clínica");
    }
}
