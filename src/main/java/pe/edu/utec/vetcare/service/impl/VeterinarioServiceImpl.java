package pe.edu.utec.vetcare.service.impl;

import org.springframework.stereotype.Service;
import pe.edu.utec.vetcare.dto.request.CreateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateVeterinarioRequest;
import pe.edu.utec.vetcare.dto.response.VeterinarioResponse;
import pe.edu.utec.vetcare.entity.VeterinarioEntity;
import pe.edu.utec.vetcare.mapper.VeterinarioMapper;
import pe.edu.utec.vetcare.repository.VeterinarioRepository;
import pe.edu.utec.vetcare.service.VeterinarioService;

import java.util.List;

@Service
public class VeterinarioServiceImpl implements VeterinarioService {

    private final VeterinarioRepository veterinarioRepository;
    private final VeterinarioMapper veterinarioMapper;

    public VeterinarioServiceImpl(
            VeterinarioRepository veterinarioRepository,
            VeterinarioMapper veterinarioMapper) {

        this.veterinarioRepository = veterinarioRepository;
        this.veterinarioMapper = veterinarioMapper;
    }

    @Override
    public List<VeterinarioResponse> getAll() {

        return veterinarioRepository.findAll()
                .stream()
                .map(veterinarioMapper::toResponse)
                .toList();
    }

    @Override
    public VeterinarioResponse getById(Long id) {

        VeterinarioEntity entity = veterinarioRepository.findById(id)
                .orElseThrow(
                        () -> new RuntimeException("Veterinario no encontrado")
                );

        return veterinarioMapper.toResponse(entity);
    }

    @Override
    public VeterinarioResponse create(
            CreateVeterinarioRequest request) {

        VeterinarioEntity entity =
                veterinarioMapper.toEntity(request);

        VeterinarioEntity savedEntity =
                veterinarioRepository.save(entity);

        return veterinarioMapper.toResponse(savedEntity);
    }

    @Override
    public VeterinarioResponse update(
            Long id,
            UpdateVeterinarioRequest request) {

        VeterinarioEntity entity =
                veterinarioRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Veterinario no encontrado"
                                )
                        );

        veterinarioMapper.updateEntity(request, entity);

        VeterinarioEntity updatedEntity =
                veterinarioRepository.save(entity);

        return veterinarioMapper.toResponse(updatedEntity);
    }

    @Override
    public void delete(Long id) {

        VeterinarioEntity entity =
                veterinarioRepository.findById(id)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "Veterinario no encontrado"
                                )
                        );

        veterinarioRepository.delete(entity);
    }

}