package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

        return mapper.toResponse(entity);
    }
}